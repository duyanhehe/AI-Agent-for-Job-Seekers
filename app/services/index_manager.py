import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, Settings, StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import Document

from app.services.jobs_dataset_loader import load_jobs
from app.config import CHROMA_DIR


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

    def retrieve_similar_jobs(self, query, top_k=100):

        retriever = self.index.as_retriever(similarity_top_k=top_k)

        nodes = retriever.retrieve(query)

        jobs = []

        for node in nodes:
            job_id = node.metadata["job_id"]
            jobs.append(self.jobs_data[job_id])

        return jobs

    # --------------------------------------------------

    def get_filters(self):

        job_functions = set()
        job_roles = set()
        job_types = set()
        locations = set()

        for job in self.jobs_data:
            if job.get("job_function"):
                job_functions.add(job["job_function"])

            if job.get("job_role"):
                job_roles.add(job["job_role"])

            if job.get("job_type"):
                job_types.add(job["job_type"])

            if job.get("location"):
                locations.add(job["location"])

        return {
            "job_functions": sorted(job_functions),
            "job_roles": sorted(job_roles),
            "job_types": sorted(job_types),
            "locations": sorted(locations),
        }

    # --------------------------------------------------

    def get_job_categories(self):

        categories = {}

        for job in self.jobs_data:
            category = job["job_function"]
            role = job["job_role"]

            if category not in categories:
                categories[category] = set()

            categories[category].add(role)

        return {k: sorted(v) for k, v in categories.items()}

    # --------------------------------------------------

    def matchJobs(
        self,
        text,
        skills,
        job_function=None,
        job_role=None,
        job_type=None,
        location=None,
    ):

        # -------------------------
        # Semantic retrieval
        # -------------------------

        skills = skills or []

        query = text + " Skills: " + ", ".join(skills)

        retrieved_jobs = self.retrieve_similar_jobs(query, top_k=100)

        print("Retrieved:", len(retrieved_jobs))

        if retrieved_jobs:
            print("Example job:")
            print(retrieved_jobs[0])

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
            job_role_val = (job.get("job_role") or "").lower()
            job_type_val = (job.get("job_type") or "").lower()
            job_country_val = (job.get("country") or "").lower()

            # -------------------------
            # scoring
            # -------------------------

            overlap = len(job_skills.intersection(cv_skills))

            function_score = (
                1 if job_function and job_function.lower() in job_function_val else 0
            )
            role_score = 1 if job_role and job_role.lower() in job_role_val else 0
            type_score = 1 if job_type and job_type.lower() in job_type_val else 0

            location_score = (
                1 if location and location.lower() == job_country_val else 0
            )

            remote_score = 1 if job.get("work_from_home") else 0

            semantic_score = 1  # retrieved by vector search

            final_score = (
                overlap * 3
                + function_score * 2
                + role_score * 2
                + type_score * 1
                + location_score * 2
                + remote_score * 1
                + semantic_score
            )

            score_100 = min(100, int((final_score / 39) * 100))

            job_with_score = job.copy()
            job_with_score["score"] = score_100

            ranked.append((score_100, job_with_score))

        ranked.sort(key=lambda x: x[0], reverse=True)

        print("Ranked:", len(ranked))

        return {"warning": country_warning, "jobs": [j for _, j in ranked[:10]]}
