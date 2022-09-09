#!/bin/bash

REPOSITORY=$(basename ${PWD%/*})

JSON=$(curl -H "Accept: application/vnd.github+json" "https://api.github.com/users/horizonx-dev/gists?per-page=100")
echo ${JSON} | jq --arg repository "${REPOSITORY}" '.[] | select(.description | startswith($repository)) | .files[] | {filename,raw_url}'
