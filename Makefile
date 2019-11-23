

dev:
	yarn build
	rm -rf example/.now
	cd example && now dev -d