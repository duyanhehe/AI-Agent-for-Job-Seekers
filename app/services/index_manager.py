import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, Settings, StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import Document

from app.services.jobs_dataset_loader import load_jobs
from app.config import CHROMA_DIR
from app.utils.filter_by_date import filter_by_date


class IndexManager:
    def __init__(self):

        Settings.embed_model = HuggingFaceEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        self.collection = self.chroma_client.get_or_create_collection("jobs_data")

        self.vector_store = ChromaVectorStore(chroma_collection=self.collection)

        self.storage_context = StorageContext.from_defaults(
            vector_store=self.vector_store
        )

        self.index = None
        self.jobs_data = []

    # --------------------------------------------------

    def indexJobs(self):

        jobs = load_jobs()
        self.jobs_data = jobs

        if self.collection.count() > 0:
            print("Loading existing job index...")
            self.index = VectorStoreIndex.from_vector_store(self.vector_store)
            return

        print("Building job index...")

        docs = []

        for i, job in enumerate(jobs):
            type_skills = []
            for v in job["type_skills"].values():
                type_skills.extend(v)

            all_skills = job["skills"] + type_skills

            text = f"""
Function: {job["job_function"]}
Role: {job["job_role"]}
Company: {job["company"]}
Location: {job["location"]}
Country: {job["country"]}
Type: {job["job_type"]}
Remote: {job["work_from_home"]}
Salary: {job["salary"]}

Skills: {", ".join(all_skills)}
"""

            docs.append(Document(text=text, metadata={"job_id": i}))

        self.index = VectorStoreIndex.from_documents(
            docs,
            storage_context=self.storage_context,
        )

        print("Job index created")

    # --------------------------------------------------

    def get_job_functions(self):
        functions = set()

        for job in self.jobs_data:
            val = (job.get("job_function") or "").strip()

            if val:
                functions.add(val)

        return sorted(functions)

    # --------------------------------------------------

    def retrieve_similar_jobs(self, query, top_k=100):

        retriever = self.index.as_retriever(similarity_top_k=top_k)

        nodes = retriever.retrieve(query)

        jobs = []

        for node in nodes:
            job_id = node.metadata["job_id"]

            job = self.jobs_data[job_id].copy()
            job["job_id"] = job_id

            jobs.append(job)

        return jobs

    # --------------------------------------------------

    def matchJobs(
        self,
        text,
        skills,
        job_function,
        job_type,
        location,
        date_filter=None,
    ):

        # -------------------------
        # Semantic retrieval
        # -------------------------

        skills = skills or []

        query = text + " Skills: " + ", ".join(skills)

        retrieved_jobs = self.retrieve_similar_jobs(query, top_k=100)

        # -------------------------
        # Country filtering
        # -------------------------

        country_jobs = []

        for job in retrieved_jobs:
            job_country = (job.get("country") or "").lower()

            if location and location.lower() == job_country:
                country_jobs.append(job)

        if country_jobs:
            jobs_for_ranking = country_jobs
            country_warning = None
        else:
            jobs_for_ranking = retrieved_jobs
            country_warning = (
                "There are no jobs listed in the country you selected. "
                "Here are some jobs from other countries that may match your skills."
            )

        # -------------------------
        # Skill overlap ranking
        # -------------------------

        ranked = []

        cv_skills = set(s.lower() for s in skills)

        for job in jobs_for_ranking:
            # collect job skills
            type_skills = []

            if isinstance(job.get("type_skills"), dict):
                for v in job["type_skills"].values():
                    if isinstance(v, list):
                        type_skills.extend(v)

            skills_list = job.get("skills", [])

            job_skills = set(s.lower() for s in (skills_list + type_skills))

            job_function_val = (job.get("job_function") or "").lower()
            job_type_val = (job.get("job_type") or "").lower()
            job_country_val = (job.get("country") or "").lower()

            # -------------------------
            # scoring
            # -------------------------

            overlap = len(job_skills.intersection(cv_skills))

            function_score = (
                1 if job_function and job_function.lower() in job_function_val else 0
            )
            type_score = 1 if job_type and job_type.lower() in job_type_val else 0

            location_score = (
                1 if location and location.lower() == job_country_val else 0
            )

            remote_score = 1 if job.get("work_from_home") else 0

            semantic_score = 1  # retrieved by vector search

            final_score = (
                overlap * 3
                + function_score * 2
                + type_score * 1
                + location_score * 2
                + remote_score * 1
                + semantic_score
            )

            job_with_score = job.copy()
            job_with_score["score"] = final_score

            ranked.append((final_score, job_with_score))

        ranked.sort(key=lambda x: x[0], reverse=True)

        top_jobs = [j for _, j in ranked[:100]]

        # filter by date if requested
        filtered_jobs = filter_by_date(top_jobs, date_filter)

        final_jobs = filtered_jobs if filtered_jobs else top_jobs

        return {
            "warning": country_warning,
            "jobs": final_jobs,
        }
