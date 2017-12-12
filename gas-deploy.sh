#!/bin/bash

if [ "$TRAVIS_EVENT_TYPE" = "push" ]; then
    if [ "$TRAVIS_BRANCH" = "master" ]; then
        mkdir -p build/test && \
            openssl aes-256-cbc -K $encrypted_238fd4bcbc3a_key -iv $encrypted_238fd4bcbc3a_iv -in gapps.config.json.enc -out build/test/gapps.config.json -d && \
            npm run upload-test
    fi
fi
