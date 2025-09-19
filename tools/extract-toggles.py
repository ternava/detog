#!/usr/bin/env python3
import re, os, sys, click, subprocess

FEATURE_PATTERNS = {
  "kubernetes": re.compile(r'featuregate.Feature = "([^"]+)"'),
  "gitlab":     re.compile(r'^.*default_enabled:\s*(true|false).*$', re.IGNORECASE)
}

@click.command()
@click.argument("project", type=click.Choice(["kubernetes","gitlab"]))
@click.argument("root", type=click.Path(exists=True))
def main(project, root):
    pat = FEATURE_PATTERNS[project]
    for dirpath, _, files in os.walk(root):
        for fname in files:
            if project=="kubernetes" and fname.endswith(".go"):
                text = open(os.path.join(dirpath,fname)).read()
                for m in pat.finditer(text):
                    print(f"{project}\t{m.group(1)}\t{dirpath}/{fname}")
            elif project=="gitlab" and fname.endswith(".yml"):
                # treat each YAML under root as a feature flag
                flag_name = os.path.splitext(fname)[0]
                print(f"{project}\t{flag_name}\t{dirpath}/{fname}")
            else:
                continue
            # get date for this version/tag
            date = subprocess.check_output([
                "git", "-C", repo_path, "log", "-1", "--format=%ci", version
            ]).decode('utf-8').strip()
            # print name, version, and date
            print(f"{toggle}\t{version}\t{date}")
if __name__=="__main__":
    main()