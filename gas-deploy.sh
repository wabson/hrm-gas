#!/bin/bash

deploy_to_project () {
    openssl aes-256-cbc -K $encrypted_238fd4bcbc3a_key -iv $encrypted_238fd4bcbc3a_iv -in .gapps-travis.enc -out $HOME/.gapps -d && \
        mkdir -p build/${1} && \
        printf "{\n  \"path\": \"includes\",\n  \"fileId\": \"${2}\"\n}" > build/${1}/gapps.config.json && \
        npm run upload-${1}
}

if [ "$TRAVIS_EVENT_TYPE" = "push" ]; then
    if [ "$TRAVIS_BRANCH" = "master" ]; then
        deploy_to_project test 1q0YEwJXEZTbKT1Bnros3NWj9PZxjT8wB6Xqg1mNb4BSDa685a9oQdrFV
    fi
fi
