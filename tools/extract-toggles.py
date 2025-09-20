#!/usr/bin/env python3
import re, os, sys, click, subprocess

FEATURE_PATTERNS = {
  "kubernetes": re.compile(r'featuregate.Feature = "([^"]+)"'),
  "gitlab":     re.compile(r'^.*default_enabled:\s*(true|false).*$', re.IGNORECASE)
}

@click.command()
@click.argument('project')
@click.argument('repo_path')
def main(project, repo_path):
    pat = FEATURE_PATTERNS[project]
    for dirpath, _, files in os.walk(repo_path):
        for fname in files:
            if project=="kubernetes" and fname.endswith(".go"):
                text = open(os.path.join(dirpath,fname)).read()
                for m in pat.finditer(text):
                    toggle = m.group(1)
                    file_path = os.path.join(dirpath, fname)
                    date = subprocess.check_output([
                        "git", "-C", repo_path, "log", "-1", "--format=%ci", "--", file_path
                    ]).decode('utf-8').strip()
                    print(f"{project}\t{toggle}\t{date}")
            elif project=="gitlab" and fname.endswith(".yml"):
                # treat each YAML under root as a feature flag
                flag_name = os.path.splitext(fname)[0]
                file_path = os.path.join(dirpath, fname)
                # skip vendored dependencies
                if 'vendor' in file_path:
                    continue
                date = subprocess.check_output([
                    "git", "-C", repo_path, "log", "-1", "--format=%ci", "--", file_path
                ]).decode('utf-8').strip()
                print(f"{project}\t{flag_name}\t{date}")
            else:
                continue
if __name__=="__main__":
    main()