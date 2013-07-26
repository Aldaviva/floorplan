LESSC := lessc

all: css

css:
	@$(LESSC) styles/all.less styles/all.css
