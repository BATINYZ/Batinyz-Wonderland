import random
import sys
from dataclasses import dataclass

import pygame


GRID_SIZE = 24
GRID_WIDTH = 30
GRID_HEIGHT = 20
WINDOW_WIDTH = GRID_SIZE * GRID_WIDTH
WINDOW_HEIGHT = GRID_SIZE * GRID_HEIGHT + 60
FPS_START = 9
FPS_MAX = 20
SPEED_UP_EVERY = 5

BG_COLOR = (16, 18, 24)
GRID_COLOR = (25, 28, 36)
SNAKE_COLOR = (72, 203, 127)
HEAD_COLOR = (108, 233, 154)
FOOD_COLOR = (255, 89, 94)
TEXT_COLOR = (232, 238, 246)


@dataclass(frozen=True)
class Point:
    x: int
    y: int


def random_food(snake: list[Point]) -> Point:
    occupied = set(snake)
    while True:
        point = Point(random.randrange(GRID_WIDTH), random.randrange(GRID_HEIGHT))
        if point not in occupied:
            return point


def draw_grid(screen: pygame.Surface) -> None:
    for x in range(0, WINDOW_WIDTH, GRID_SIZE):
        pygame.draw.line(screen, GRID_COLOR, (x, 0), (x, GRID_SIZE * GRID_HEIGHT), 1)
    for y in range(0, GRID_SIZE * GRID_HEIGHT, GRID_SIZE):
        pygame.draw.line(screen, GRID_COLOR, (0, y), (WINDOW_WIDTH, y), 1)


def draw_rect(screen: pygame.Surface, point: Point, color: tuple[int, int, int]) -> None:
    rect = pygame.Rect(point.x * GRID_SIZE, point.y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
    pygame.draw.rect(screen, color, rect.inflate(-3, -3), border_radius=6)


def show_text(
    screen: pygame.Surface,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    score: int,
    game_over: bool,
) -> None:
    ui_rect = pygame.Rect(0, GRID_SIZE * GRID_HEIGHT, WINDOW_WIDTH, 60)
    pygame.draw.rect(screen, (10, 12, 18), ui_rect)
    score_text = font.render(f"Score: {score}", True, TEXT_COLOR)
    screen.blit(score_text, (14, GRID_SIZE * GRID_HEIGHT + 16))
    if game_over:
        over = small_font.render("Game Over - Press R to restart / Q to quit", True, TEXT_COLOR)
        screen.blit(over, (WINDOW_WIDTH // 2 - over.get_width() // 2, GRID_SIZE * GRID_HEIGHT + 20))


def main() -> None:
    pygame.init()
    pygame.display.set_caption("Snake")
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("consolas", 28, bold=True)
    small_font = pygame.font.SysFont("consolas", 20)

    snake = [Point(GRID_WIDTH // 2, GRID_HEIGHT // 2)]
    direction = Point(1, 0)
    next_direction = direction
    food = random_food(snake)
    score = 0
    game_over = False

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit(0)
            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_q, pygame.K_ESCAPE):
                    pygame.quit()
                    sys.exit(0)
                if game_over and event.key == pygame.K_r:
                    snake = [Point(GRID_WIDTH // 2, GRID_HEIGHT // 2)]
                    direction = Point(1, 0)
                    next_direction = direction
                    food = random_food(snake)
                    score = 0
                    game_over = False
                if event.key == pygame.K_UP and direction.y != 1:
                    next_direction = Point(0, -1)
                elif event.key == pygame.K_DOWN and direction.y != -1:
                    next_direction = Point(0, 1)
                elif event.key == pygame.K_LEFT and direction.x != 1:
                    next_direction = Point(-1, 0)
                elif event.key == pygame.K_RIGHT and direction.x != -1:
                    next_direction = Point(1, 0)

        if not game_over:
            direction = next_direction
            head = snake[0]
            new_head = Point(head.x + direction.x, head.y + direction.y)

            wall_hit = (
                new_head.x < 0
                or new_head.x >= GRID_WIDTH
                or new_head.y < 0
                or new_head.y >= GRID_HEIGHT
            )
            body_hit = new_head in snake
            if wall_hit or body_hit:
                game_over = True
            else:
                snake.insert(0, new_head)
                if new_head == food:
                    score += 1
                    food = random_food(snake)
                else:
                    snake.pop()

        screen.fill(BG_COLOR)
        draw_grid(screen)
        draw_rect(screen, food, FOOD_COLOR)
        for i, part in enumerate(snake):
            draw_rect(screen, part, HEAD_COLOR if i == 0 else SNAKE_COLOR)
        show_text(screen, font, small_font, score, game_over)
        pygame.display.flip()

        speed_level = min(FPS_START + (score // SPEED_UP_EVERY), FPS_MAX)
        clock.tick(speed_level)


if __name__ == "__main__":
    main()
