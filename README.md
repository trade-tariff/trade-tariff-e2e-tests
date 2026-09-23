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

`project` sets the test directory, and must be set. It can be set to:

- `admin`
- `api`
- `frontend`
- `myott`

`environment` sets the AWS environment target. It can be set to:

- `development`
- `staging`
- `production`

and will default to `development`.

`workers` sets the number of Playwright workers used. This is set between 1 and
2 depending on the `project` you have chosen. It can be overridden by providing
a value.

For example, to run the admin tests against the staging environment, run:

```sh
make test project=admin environment=staging
```

## Environment variables

There are two environment variables that are used in running the test suite.

- `PLAYWRIGHT_PROJECT` sets the tests to run. This uses the configuration in
  `playwright.config.js`; in the `projects` array. It has no default, and must
  be set to run tests. If you are using the Makefile, this is set using the
  `project` variable.

- `PLAYWRIGHT_ENV` is used to set up some utilities dependant on the targeted
  environment. It defaults to `development`. If you are using the Makefile,
  this is set using the `environment` variable.

## Running tests in debug mode

It is possible to run Playwright in debug mode. This opens Chrome for Testing
and a Playwright debugger window that allows you to step through tests
line-by-line.

You will need to set the environment variables `PLAYWRIGHT_PROJECT` and
`PLAYWRIGHT_ENV` as described above.

For example, to run the frontend tests in debug mode against the development
environment, run:

```bash
PLAYWRIGHT_PROJECT="frontend" yarn run playwright test --headed --debug
```
