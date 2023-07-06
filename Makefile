WEB_IMAGE_PROD=jirkamayer/unisave-website:latest
URL_PREFIX_PROD=https://unisave.cloud

WEB_IMAGE_LOCAL=jirkamayer/unisave-website:latest-local
URL_PREFIX_LOCAL=http://unisave.local

.PHONY: build-prod push-prod

build-prod:
	export DOCKER_BUILDKIT=1; \
	docker image build -t $(WEB_IMAGE_PROD) --build-arg WEBSITE_URL_PREFIX=$(URL_PREFIX_PROD) .

build-local:
	export DOCKER_BUILDKIT=1; \
	docker image build -t $(WEB_IMAGE_LOCAL) --build-arg WEBSITE_URL_PREFIX=$(URL_PREFIX_LOCAL) .

push-prod:
	docker push $(WEB_IMAGE_PROD)

push-local:
	docker push $(WEB_IMAGE_LOCAL)
