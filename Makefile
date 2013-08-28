all:

run:
	@node .

install-deps:
	@sudo apt-get install graphicsmagick
	@npm install
