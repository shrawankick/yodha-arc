"""Auto PR Creator for v0.2.

This script checks whether the branch "feature/v0.2-mobile-finisher-nutrition"
exists in the shrawankick/yodha-arc repository. If the branch exists and no open
pull request targets ``main`` from that branch, a new PR is created.

Usage:
    Set the ``GITHUB_TOKEN`` environment variable to a GitHub personal access
    token that has ``repo`` access and run the script with Python 3.

The script will output the URL of the new PR or notify if one already exists.
"""

import os
import requests

# === CONFIG ===
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "YOUR_GITHUB_TOKEN")
REPO_OWNER = "shrawankick"
REPO_NAME = "yodha-arc"
BRANCH_NAME = "feature/v0.2-mobile-finisher-nutrition"
PR_TITLE = "v0.2 — mobile-first UI, finisher library & timer, kg estimator, nutrition log"
PR_BODY = (
    "This PR introduces:\n"
    "- Mobile-first UI enhancements\n"
    "- Finisher library with timer\n"
    "- KG estimator for lifts\n"
    "- Nutrition log feature\n"
)

# === HEADERS ===
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}

# === STEP 1: CHECK BRANCH EXISTS ===
branch_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/branches/{BRANCH_NAME}"
branch_resp = requests.get(branch_url, headers=headers)

if branch_resp.status_code != 200:
    print(f"❌ Branch '{BRANCH_NAME}' does not exist or repo inaccessible.")
    raise SystemExit(1)

# === STEP 2: CHECK IF PR ALREADY EXISTS ===
pr_search_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/pulls"
params = {"state": "open", "head": f"{REPO_OWNER}:{BRANCH_NAME}", "base": "main"}
pr_search_resp = requests.get(pr_search_url, headers=headers, params=params)

if pr_search_resp.status_code == 200 and len(pr_search_resp.json()) > 0:
    existing_pr = pr_search_resp.json()[0]
    print(f"ℹ️ PR already exists: {existing_pr['html_url']}")
    raise SystemExit(0)

# === STEP 3: CREATE NEW PR ===
create_pr_payload = {
    "title": PR_TITLE,
    "head": BRANCH_NAME,
    "base": "main",
    "body": PR_BODY,
}
create_pr_resp = requests.post(pr_search_url, headers=headers, json=create_pr_payload)

if create_pr_resp.status_code == 201:
    pr_data = create_pr_resp.json()
    print(f"✅ PR created: {pr_data['html_url']}")
else:
    print(f"❌ Failed to create PR: {create_pr_resp.status_code} — {create_pr_resp.text}")
