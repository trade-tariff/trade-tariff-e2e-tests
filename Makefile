.PHONY: test debug

environment ?= development
projects ?= $(project)

ifeq ($(strip $(projects)),)
$(info 'projects' unset; running all tests)
endif

comma := ,
project_names := $(subst $(comma), ,$(projects))
project_args := $(foreach project,$(project_names),--project=$(strip $(project)))

ifneq ($(filter admin, $(project_names)),)
workers ?= 1
else
workers ?= 2
endif

test:
	PLAYWRIGHT_ENV=$(environment) \
	yarn run playwright test \
		$(project_args) \
		--workers=$(workers) \
		$(args)

debug:
	PLAYWRIGHT_ENV=$(environment) \
	yarn run playwright test \
		$(project_args) \
		--workers=$(workers) \
		--debug \
		$(args)
