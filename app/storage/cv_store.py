cv_memory = {}


def save_cv(cv_id, text):
    cv_memory[cv_id] = text


def get_cv(cv_id):
    return cv_memory.get(cv_id)
