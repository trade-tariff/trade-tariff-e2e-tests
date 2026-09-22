.PHONY: test

environment ?= development
project ?= ott

ifeq ($(project), admin)
  workers ?= 1
else
  workers ?= 2
endif

test:
	PLAYWRIGHT_PROJECT=$(project) \
	PLAYWRIGHT_ENV=$(environment) \
	yarn run playwright test \
		--project=$(project) \
		--workers=$(workers)
