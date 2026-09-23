.PHONY: test

environment ?= development

ifeq ($(strip $(project)),)
$(error project must be set! see README.md for usage)
endif

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
