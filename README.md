# Research Papers on Feature Toggles

# detog

...existing content...

## Feature Gate History Extraction

1. Ensure the extractor script is present:
    ```bash
    ls tools/extract_feature_gates.py
    ```

2. Run it against the upstream Kubernetes repo (no local clone required):
    ```bash
    python3 tools/extract_feature_gates.py \
      https://github.com/kubernetes/kubernetes \
      static/data/feature_gates.csv
    ```
   This produces `static/data/feature_gates.csv` with columns:
   ```
   date,sha,event,feature
   ```

3. (Next) aggregate these events into daily counts and feed into your chart.