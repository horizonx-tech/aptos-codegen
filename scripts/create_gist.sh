#!/bin/bash

TOKEN="${TOKEN}"
REPOSITORY=$(basename ${PWD%/*})
DESCRIPTION="${REPOSITORY}-badges"

DIR=$1
FILE_NAMES=("${DESCRIPTION}")
FILE_NAMES+=(`ls "${DIR}"`)

body=$(./build_gist.sh "${DIR}" "${FILE_NAMES[@]}")

curl \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://api.github.com/gists" \
  -d "${body}"
