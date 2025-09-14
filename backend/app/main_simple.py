"""
Simple test for FastAPI app
"""
from fastapi import FastAPI

app = FastAPI(title="Test ECC800 API")

@app.get("/")
def root():
    return {"message": "Hello ECC800"}

@app.get("/health")
def health():
    return {"status": "ok"}
