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
    echo "--------------- testing truffle ${e} ---------------"

    cd  "${ROOT}/${e}"

    if ! yarn test-mandala; then
      ((failed=failed+1))
    fi

    echo ""
  done

  echo "+++++++++++++++++++++++"
  echo "truffle test failed: $failed"
  echo "+++++++++++++++++++++++"
}

build_and_test() {
  build_all
  test_all

  exit $failed
}

case "$1" in
  "build") build_all ;;
  "rebuild") rebuild_all ;;
  "test") test_all ;;
  "build_and_test") build_and_test ;;
  *) build_and_test ;;
esac
