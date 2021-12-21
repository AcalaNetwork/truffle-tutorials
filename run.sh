#!/bin/bash

failed=0

build_all() {
  sh -c 'rush build \
    -t truffle-tutorial-hello-world \
    -t truffle-tutorial-echo \
    -t truffle-tutorial-token \
    -t truffle-tutorial-nft'
}

rebuild_all() {
  sh -c 'rush rebuild \
    -t truffle-tutorial-hello-world \
    -t truffle-tutorial-echo \
    -t truffle-tutorial-token \
    -t truffle-tutorial-nft'
}

test_all() {
  examples=(
    "hello-world"
    "echo"
    "token"
    "nft"
  )

  ROOT=$(pwd)

  for e in "${examples[@]}"
  do
    echo "--------------- Running Truffle tests ${e} ---------------"

    cd  "${ROOT}/${e}"

    if [ $1 = "CI" ]; then
      if ! yarn test-mandala:CI; then
        ((failed=failed+1))
      fi
    else
      if ! yarn test-mandala; then
        ((failed=failed+1))
      fi
    fi

    echo ""
  done

  echo "+++++++++++++++++++++++"
  echo "Number of failed Truffle tests: $failed"
  echo "+++++++++++++++++++++++"
}

build_and_test() {
  build_all
  test_all $1

  exit $failed
}

case "$1" in
  "build") build_all ;;
  "rebuild") rebuild_all ;;
  "test") test_all "local" ;;
  "build_and_test") build_and_test "local" ;;
  "CI_build_and_test") build_and_test "CI" ;;
  *) build_and_test "local" ;;
esac
