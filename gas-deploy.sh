#!/bin/bash

deploy_to_project () {
    openssl aes-256-cbc -K $encrypted_238fd4bcbc3a_key -iv $encrypted_238fd4bcbc3a_iv -in .gapps-travis.enc -out $HOME/.gapps -d && \
        mkdir -p build/${1} && \
        printf "{\n  \"path\": \"includes\",\n  \"fileId\": \"${2}\"\n}" > build/${1}/gapps.config.json && \
        npm run upload-${1}
}

deploy_profile=
if [ "$TRAVIS_EVENT_TYPE" = "push" ]; then
    if [ "$TRAVIS_BRANCH" = "develop" ]; then
        deploy_profile="test"
        deploy_target="$gas_target_test"
    elif [ "$TRAVIS_BRANCH" = "master" ]; then
        deploy_profile="prod"
        deploy_target="$gas_target_prod"
    fi
fi

if [ -n "$deploy_profile" -a -n "$deploy_target" ]; then
    echo "Deploying to project $deploy_target with profile $deploy_profile"
    deploy_to_project "$deploy_profile" "$deploy_target"
fi
