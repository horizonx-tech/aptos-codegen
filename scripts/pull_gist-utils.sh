#!/bin/bash

json=$(curl -H "Accept: application/vnd.github+json" "https://api.github.com/gists/715f2ab656a3d9c91f1c99d80406d3f2")
files=$(echo "${json}" | jq '[.files[] | select(.filename | endswith(".sh"))]')
length=$(echo "${files}" | jq 'length')

for i in $( seq 0 $(($length - 1)) ); do
  filename=$(echo "${files}" | jq -r .[$i].filename)
  url=$(echo "${files}" | jq -r .[$i].raw_url)
  curl -o "${filename}" "${url}"
done

chmod 755 ./*.sh
