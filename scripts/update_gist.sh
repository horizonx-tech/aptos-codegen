#!/bin/bash

TOKEN="${TOKEN}"
REPOSITORY=$(basename ${PWD%/*})
DESCRIPTION="${REPOSITORY}-badges"

GIST_ID=$1
DIR=$2
FILE_NAMES=("${DESCRIPTION}")
FILE_NAMES+=(`ls "${DIR}"`)

body=$(./build_gist.sh "${DIR}" "${FILE_NAMES[@]}")

curl \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://api.github.com/gists/${GIST_ID}" \
  -d "${body}"
