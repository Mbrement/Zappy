############# Variables #############

GFX_CLIENT_DIR	= ./clients/gfx/scripts
AI_CLIENT_DIR	= ./clients/AI
SERVER_DIR		= ./server

########### Graphical Client ###########

build_gfx:
	@cd $(GFX_CLIENT_DIR) && chmod +x buildGFX.sh && ./buildGFX.sh

gfx:
	@cd $(GFX_CLIENT_DIR) && chmod +x runGFX.sh && ./runGFX.sh

clear_gfx:
	@cd $(GFX_CLIENT_DIR) && chmod +x cleanGFX.sh && ./cleanGFX.sh

re_gfx: build_gfx gfx

############# AI Client #################

build_ai:
	@cd $(AI_CLIENT_DIR) && chmod +x buildSea.sh && ./buildSea.sh

clear_ai:
	@cd $(AI_CLIENT_DIR) && npm cache clean --force && rm -rf node_modules package-lock.json AIClient

############# Server #############

build_server:
	@cd $(SERVER_DIR) && cargo build --release

clear_server:
	@cd $(SERVER_DIR) && cargo clean

############# General #############

all: build_gfx build_ai build_server

clear: clear_gfx clear_ai clear_server

.PHONY: build_gfx, gfx, clear_gfx, re_gfx, build_ai, clear_ai, build_server, clear_server