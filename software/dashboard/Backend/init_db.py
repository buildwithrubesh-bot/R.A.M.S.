from pathlib import Path

from dotenv import load_dotenv

from db import get_cursor

BASE_DIR = Path(__file__).resolve().parent


def main():
    load_dotenv(BASE_DIR / ".env", override=True)
    with open(BASE_DIR / "schema.sql", "r", encoding="utf-8") as schema_file:
        sql = schema_file.read()

    with get_cursor() as cursor:
        cursor.execute(sql)

    print("Database schema is ready.")


if __name__ == "__main__":
    main()
