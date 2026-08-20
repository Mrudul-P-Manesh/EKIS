import pytest
import os
import glob
from backend.app.ingestion.pipeline import ingestion_pipeline
from backend.app.core.database import metadata_db


@pytest.fixture(scope="session", autouse=True)
def seed_test_data():
    """Ensure sample data is ingested before running backend tests."""
    sample_docs_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data", "docs")
    sample_code_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data", "code")

    files_to_seed = []
    if os.path.exists(sample_docs_dir):
        files_to_seed.extend(glob.glob(os.path.join(sample_docs_dir, "*.*")))
    if os.path.exists(sample_code_dir):
        files_to_seed.extend(glob.glob(os.path.join(sample_code_dir, "*.*")))

    for fpath in files_to_seed:
        try:
            srv = "auth-service" if "auth" in fpath or "jwt" in fpath else None
            ingestion_pipeline.ingest_file(fpath, service_name=srv)
        except Exception:
            pass
    yield
