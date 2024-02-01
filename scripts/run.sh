#!/bin/bash
dir=`dirname $0`
currentDir=`pwd`
cd $dir
cd ..

function runCommand() {
  for d in ./packages/* ; do
    echo "======================================="
    echo "Dir: '${d}'"
    echo "---------------------------------------"
    bash -c "(cd \"$d\" && $@)";
  done
}

cmd="$@"
if [ "${cmd}" = "" ]; then
 cmd="git status";
fi
runCommand "${cmd}"
