import random
import sys
from dataclasses import dataclass

import pygame


GRID_SIZE = 24
GRID_WIDTH = 30
GRID_HEIGHT = 20
TOP_BANNER_HEIGHT = 88
BOTTOM_UI_HEIGHT = 60
WINDOW_WIDTH = GRID_SIZE * GRID_WIDTH
WINDOW_HEIGHT = TOP_BANNER_HEIGHT + GRID_SIZE * GRID_HEIGHT + BOTTOM_UI_HEIGHT
FPS_START = 9
FPS_MAX = 20
SPEED_UP_EVERY = 5

GRID_COLOR = (34, 71, 54)
SNAKE_COLOR = (120, 219, 115)
HEAD_COLOR = (160, 242, 130)
FOOD_COLOR = (255, 105, 87)
TEXT_COLOR = (237, 246, 226)


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
        pygame.draw.line(
            screen,
            GRID_COLOR,
            (x, TOP_BANNER_HEIGHT),
            (x, TOP_BANNER_HEIGHT + GRID_SIZE * GRID_HEIGHT),
            1,
        )
    for y in range(TOP_BANNER_HEIGHT, TOP_BANNER_HEIGHT + GRID_SIZE * GRID_HEIGHT, GRID_SIZE):
        pygame.draw.line(screen, GRID_COLOR, (0, y), (WINDOW_WIDTH, y), 1)


def draw_rect(screen: pygame.Surface, point: Point, color: tuple[int, int, int]) -> None:
    rect = pygame.Rect(
        point.x * GRID_SIZE,
        TOP_BANNER_HEIGHT + point.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE,
    )
    pygame.draw.rect(screen, color, rect.inflate(-3, -3), border_radius=6)


def draw_jungle_background(screen: pygame.Surface) -> None:
    for y in range(WINDOW_HEIGHT):
        blend = y / WINDOW_HEIGHT
        color = (
            int(18 + 22 * blend),
            int(70 + 70 * blend),
            int(44 + 30 * blend),
        )
        pygame.draw.line(screen, color, (0, y), (WINDOW_WIDTH, y))

    for x in range(0, WINDOW_WIDTH, 72):
        pygame.draw.circle(screen, (25, 92, 48), (x + 30, TOP_BANNER_HEIGHT - 8), 38)
        pygame.draw.circle(screen, (38, 118, 58), (x + 60, TOP_BANNER_HEIGHT - 18), 30)

    for vine_x in (28, 108, 206, 310, 444, 560, 670):
        points = []
        for step in range(0, TOP_BANNER_HEIGHT, 8):
            points.append((vine_x + (step % 16) - 8, step))
        pygame.draw.lines(screen, (44, 121, 55), False, points, 3)
        for px, py in points[::3]:
            pygame.draw.ellipse(screen, (78, 155, 78), (px - 10, py + 1, 12, 7))


def draw_title(screen: pygame.Surface, title_font: pygame.font.Font) -> None:
    title = title_font.render("GOKTURK BATUHAN KACIN", True, (241, 255, 219))
    shadow = title_font.render("GOKTURK BATUHAN KACIN", True, (19, 64, 31))
    x_pos = WINDOW_WIDTH // 2 - title.get_width() // 2
    y_pos = TOP_BANNER_HEIGHT // 2 - title.get_height() // 2 + 2
    screen.blit(shadow, (x_pos + 2, y_pos + 2))
    screen.blit(title, (x_pos, y_pos))


def show_text(
    screen: pygame.Surface,
    font: pygame.font.Font,
    small_font: pygame.font.Font,
    score: int,
    game_over: bool,
) -> None:
    ui_top = TOP_BANNER_HEIGHT + GRID_SIZE * GRID_HEIGHT
    ui_rect = pygame.Rect(0, ui_top, WINDOW_WIDTH, BOTTOM_UI_HEIGHT)
    pygame.draw.rect(screen, (16, 48, 35), ui_rect)
    score_text = font.render(f"Score: {score}", True, TEXT_COLOR)
    screen.blit(score_text, (14, ui_top + 16))
    if game_over:
        over = small_font.render("Game Over - Press R to restart / Q to quit", True, TEXT_COLOR)
        screen.blit(over, (WINDOW_WIDTH // 2 - over.get_width() // 2, ui_top + 20))


def main() -> None:
    pygame.init()
    pygame.display.set_caption("Snake")
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("consolas", 28, bold=True)
    small_font = pygame.font.SysFont("consolas", 20)
    title_font = pygame.font.SysFont("impact", 44, bold=True)

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

        draw_jungle_background(screen)
        draw_title(screen, title_font)
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
