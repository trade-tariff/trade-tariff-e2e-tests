# trade-tariff-e2e-tests

[![Check Production](https://github.com/trade-tariff/trade-tariff-e2e-tests/actions/workflows/check-production.yml/badge.svg)](https://github.com/trade-tariff/trade-tariff-e2e-tests/actions/workflows/check-production.yml)

> Remember to install pre-commit hooks before making any changes to the
> repository

Playwright suite used to validate the end to end functionality of the OTT
Service.

The OTT service answers two main questions:

1. What am I trading?
2. What measures apply to me?

This suite validates some of the core journeys that help the user answer these
questions.

The OTT frontend is accessible on the following URLs:

- [development][development]
- [staging][staging]
- [production][production]

Implementation details for the frontend and backend can be reviewed, here:

- [frontend][frontend-github]
- [backend][backend-github]

[development]: https://dev.trade-tariff.service.gov.uk/
[staging]: https://staging.trade-tariff.service.gov.uk/
[production]: https://www.trade-tariff.service.gov.uk/
[frontend-github]: https://github.com/trade-tariff/trade-tariff-frontend
[backend-github]: https://github.com/trade-tariff/trade-tariff-backend

## Installing prerequisites

```bash
yarn install
yarn run playwright install
```

## Running tests

This repository contains a [Makefile](./Makefile) to simplify running the test
suite.

You can run the tests by running `make test` in the repository root. There are
variables that control which tests are run, which environment to use, and how
many Playwright workers to use.

`projects` sets which test directories are run. If not provided, all tests run.
It can be set to a combination of the following, as a comma separated string:

- `admin`
- `api`
- `frontend`
- `myott`

If you only want to run one test project, you can use the singular form,
`project` instead.

`environment` sets the AWS environment target. It can be set to:

- `development`
- `staging`
- `production`

and will default to `development`.

`workers` sets the number of Playwright workers used. This is set between 1 and
2 depending on the `project` you have chosen. It can be overridden by providing
a value.

For example, to run the admin and api tests against the staging environment,
run:

```sh
make test projects=admin,api environment=staging
```

## Environment variables

- `PLAYWRIGHT_ENV` is used to set up some utilities dependant on the targeted
  environment. It defaults to `development`. If you are using the Makefile,
  this is set using the `environment` variable.

## Running tests in debug mode

It is possible to run Playwright in debug mode. This opens Chrome for Testing
and a Playwright debugger window that allows you to step through tests
line-by-line.

To use debug mode, you can use the Makefile job `debug`. For example, to run
the admin tests, in the staging environment, in debug mode:

```sh
make debug project=admin environment=staging
```

You can also run specific files, for example:

```sh
make debug project=admin environment=staging -- tests/admin/adminUI-news-items.spec.js
```
