all:

run:
	@node .

install-deps:
	@apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
	@npm install
