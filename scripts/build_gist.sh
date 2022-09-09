#!/bin/bash

DIR=$1
shift
DESCRIPTION=$1
FILE_NAMES=("$@")

files=$(
  for name in ${FILE_NAMES[@]}; do
    if [[ "${name}" == "${DESCRIPTION}" ]]; then
      echo "0:${name}"
      echo "${FILE_NAMES[@]:1}"
    else
      echo "${name}"
      echo `cat "${DIR}${name}"`
    fi
  done | jq -c -n -R 'reduce inputs as $i ({}; . + { ($i): { content:(input) } })'
)

read -r -d '' BODY <<EOF
{
  "description": "${DESCRIPTION}",
  "public": true,
  "files": ${files}
}
EOF

echo ${BODY}
