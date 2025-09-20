#!/usr/bin/env python3
import re, subprocess, click

FEATURE_PATTERN = re.compile(r'featuregate.Feature = "([^"]+)"')

@click.command()
@click.argument('repo_path')
def main(repo_path):
    # list all tags
    tags = subprocess.check_output(["git", "-C", repo_path, "tag", "-l"]).decode().split()  
    # header
    print("version\tcount\tdate")
    for tag in sorted(tags):
        # get date of tag
        date = subprocess.check_output([
            "git", "-C", repo_path, "log", "-1", "--format=%ci", tag
        ]).decode().strip()
        # find toggles at this tag
        lines = subprocess.check_output([
            "git", "-C", repo_path, "grep", "-h", "-o", "featuregate.Feature = [^\"]+\"", tag, "--", "*.go"
        ]).decode().splitlines()
        # extract unique names
        toggles = set(FEATURE_PATTERN.search(l).group(1) for l in lines if FEATURE_PATTERN.search(l))
        print(f"{tag}\t{len(toggles)}\t{date}")

if __name__ == '__main__':
    main()