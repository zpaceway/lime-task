.PHONY: init

init:
	docker compose up -d
	npm install
	npx prisma migrate dev
	npm run seed
	npm run dev
