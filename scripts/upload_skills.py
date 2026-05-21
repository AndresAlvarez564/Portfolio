"""
upload_skills.py — Bulk-create skills via the portfolio API.

Usage:
    py scripts/upload_skills.py

You will be prompted for:
  - API base URL  (e.g. https://pxxs1pf3oh.execute-api.us-east-1.amazonaws.com/dev)
  - Cognito ID token

How to get your ID token:
  1. Open the admin panel in Chrome/Edge.
  2. Open DevTools → Application → Local Storage → your site origin.
  3. Find the key that ends in ".idToken" and copy its value.
"""

import json
import time
import urllib.request
import urllib.error

SKILLS: list[dict] = [
    # ── Cloud / AWS ────────────────────────────────────────────
    {"name": "AWS Lambda",                   "category": "cloud",     "order": 1},
    {"name": "Amazon API Gateway",           "category": "cloud",     "order": 2},
    {"name": "Amazon DynamoDB",              "category": "cloud",     "order": 3},
    {"name": "Amazon S3",                    "category": "cloud",     "order": 4},
    {"name": "Amazon CloudFront",            "category": "cloud",     "order": 5},
    {"name": "Amazon Cognito",               "category": "cloud",     "order": 6},
    {"name": "AWS IAM",                      "category": "cloud",     "order": 7},
    {"name": "Amazon VPC",                   "category": "cloud",     "order": 8},
    {"name": "Security Groups",              "category": "cloud",     "order": 9},
    {"name": "Amazon EC2",                   "category": "cloud",     "order": 10},
    {"name": "Auto Scaling",                 "category": "cloud",     "order": 11},
    {"name": "Elastic Load Balancing",       "category": "cloud",     "order": 12},
    {"name": "Amazon SQS",                   "category": "cloud",     "order": 13},
    {"name": "Amazon SES",                   "category": "cloud",     "order": 14},
    {"name": "Amazon EventBridge",           "category": "cloud",     "order": 15},
    {"name": "Amazon CloudWatch",            "category": "cloud",     "order": 16},
    {"name": "Amazon Polly",                 "category": "cloud",     "order": 17},
    {"name": "AWS Amplify",                  "category": "cloud",     "order": 18},
    {"name": "AWS Well-Architected Framework","category": "cloud",    "order": 19},

    # ── Backend ────────────────────────────────────────────────
    {"name": "Python",                       "category": "backend",   "order": 1},
    {"name": "TypeScript",                   "category": "backend",   "order": 2},
    {"name": "JavaScript",                   "category": "backend",   "order": 3},
    {"name": "REST APIs",                    "category": "backend",   "order": 4},
    {"name": "Serverless APIs",              "category": "backend",   "order": 5},
    {"name": "Authentication flows",         "category": "backend",   "order": 6},
    {"name": "Role-based access control",    "category": "backend",   "order": 7},
    {"name": "Business logic implementation","category": "backend",   "order": 8},
    {"name": "File upload workflows",        "category": "backend",   "order": 9},
    {"name": "Email notification workflows", "category": "backend",   "order": 10},
    {"name": "Event-driven systems",         "category": "backend",   "order": 11},

    # ── Frontend ───────────────────────────────────────────────
    {"name": "React",                        "category": "frontend",  "order": 1},
    {"name": "Vite",                         "category": "frontend",  "order": 2},
    {"name": "HTML",                         "category": "frontend",  "order": 3},
    {"name": "CSS",                          "category": "frontend",  "order": 4},
    {"name": "TailwindCSS",                  "category": "frontend",  "order": 5},
    {"name": "Ant Design",                   "category": "frontend",  "order": 6},
    {"name": "React Router",                 "category": "frontend",  "order": 7},
    {"name": "React Hook Form",              "category": "frontend",  "order": 8},
    {"name": "Yup",                          "category": "frontend",  "order": 9},
    {"name": "Responsive design",            "category": "frontend",  "order": 10},
    {"name": "Admin panels",                 "category": "frontend",  "order": 11},
    {"name": "Dashboards",                   "category": "frontend",  "order": 12},
    {"name": "Public website interfaces",    "category": "frontend",  "order": 13},

    # ── DevOps / Infrastructure ────────────────────────────────
    {"name": "AWS CDK",                      "category": "devops",    "order": 1},
    {"name": "AWS CLI",                      "category": "devops",    "order": 2},
    {"name": "Infrastructure as Code",       "category": "devops",    "order": 3},
    {"name": "CloudFormation basics",        "category": "devops",    "order": 4},
    {"name": "Terraform fundamentals",       "category": "devops",    "order": 5},
    {"name": "Deployment workflows",         "category": "devops",    "order": 6},
    {"name": "Environment variables",        "category": "devops",    "order": 7},
    {"name": "Monitoring and logging",       "category": "devops",    "order": 8},
    {"name": "Basic CI/CD",                  "category": "devops",    "order": 9},
    {"name": "Serverless deployment",        "category": "devops",    "order": 10},
    {"name": "Cost optimization",            "category": "devops",    "order": 11},
    {"name": "Security best practices",      "category": "devops",    "order": 12},

    # ── Databases ──────────────────────────────────────────────
    {"name": "NoSQL data modeling",          "category": "databases", "order": 1},
    {"name": "Single Table Design basics",   "category": "databases", "order": 2},
    {"name": "Global Secondary Indexes",     "category": "databases", "order": 3},
    {"name": "RDS / Aurora fundamentals",    "category": "databases", "order": 4},
    {"name": "PostgreSQL fundamentals",      "category": "databases", "order": 5},
    {"name": "MongoDB Atlas basics",         "category": "databases", "order": 6},
    {"name": "Supabase basics",              "category": "databases", "order": 7},
    {"name": "Neon fundamentals",            "category": "databases", "order": 8},

    # ── AI / ML ────────────────────────────────────────────────
    {"name": "AWS Bedrock fundamentals",     "category": "ai",        "order": 1},
    {"name": "Amazon SageMaker fundamentals","category": "ai",        "order": 2},
    {"name": "Generative AI concepts",       "category": "ai",        "order": 3},
    {"name": "Machine Learning foundations", "category": "ai",        "order": 4},
]


def create_skill(base_url: str, token: str, skill: dict) -> dict:
    url = f"{base_url.rstrip('/')}/skills"
    payload = json.dumps({
        "name":       skill["name"],
        "category":   skill["category"],
        "visibility": "visible",
        "order":      skill["order"],
    }).encode()

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def main() -> None:
    print("=== Portfolio Skills Uploader ===\n")
    base_url = input("API base URL: ").strip()
    token    = input("Cognito ID token: ").strip()

    if not base_url or not token:
        print("Both values are required.")
        return

    total   = len(SKILLS)
    success = 0
    failed  = []

    for i, skill in enumerate(SKILLS, 1):
        label = f"[{i:>2}/{total}] {skill['category']:<10} {skill['name']}"
        try:
            create_skill(base_url, token, skill)
            print(f"  OK  {label}")
            success += 1
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")
            print(f"  ERR {label}  →  HTTP {exc.code}: {body[:120]}")
            failed.append(skill["name"])
        except Exception as exc:
            print(f"  ERR {label}  →  {exc}")
            failed.append(skill["name"])

        time.sleep(0.15)   # avoid hitting API GW rate limits

    print(f"\n✓ {success}/{total} skills created.")
    if failed:
        print(f"✗ Failed ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
