"""Monthly refresh: same merge as the backfill, run with mode label 'enrich'."""
from .backfill_api import run

if __name__ == "__main__":
    raise SystemExit(run("enrich"))
