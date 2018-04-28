all:

install-deps:
	@npm install

install-utils:
	@npm install -g standardjs eslint

run:
	@node .
