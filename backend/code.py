from fastapi import APIRouter


router = APIRouter(
    prefix="/api/code",
    tags=["Code"]
)


@router.post("/run")
def run_code():
    """
    Temporary mock endpoint.

    Later this can be replaced with a secure
    Python execution service.
    """

    return {
        "output": "Code executed successfully! (Mock response)"
    }