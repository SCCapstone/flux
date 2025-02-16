from .models import Achievement, UserAchievement, Rating, Book
from django.contrib.auth.models import User

def check_and_award_achievements(user):
    achievements = {
        "rate_5_books": {
            "name": "Critic",
            "description": "Rated 5 books!",
            "criteria": lambda u: Rating.objects.filter(user=u).count() >= 5
        },
        "read_10_books": {
            "name": "Book Worm",
            "description": "Read 10 books!",
            "criteria": lambda u: Book.objects.filter(user=u).count() >= 10
        }
    }

    for key, achievement in achievements.items():
        if achievement["criteria"](user):
            ach_obj, created = Achievement.objects.get_or_create(
                name=achievement["name"],
                defaults={"description": achievement["description"], "criteria": key}
            )
            if not UserAchievement.objects.filter(user=user, achievement=ach_obj).exists():
                UserAchievement.objects.create(user=user, achievement=ach_obj)
                print(f"🏆 {user.username} earned the {achievement['name']} achievement!")