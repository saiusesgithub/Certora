# test.py

from generator.main import generate_certificates

config = [
    {
        "type": "name",
        "x": 300,
        "y": 200,
        "fontSize": 40,
        "color": "#ffffff",
        "fontFamily": "arial.ttf"
    }
]

names = ["John Doe", "Jane Smith"]

generate_certificates(
    template_path="template.png",
    config=config,
    names=names,
    college="VJIT",
    event="Hackathon"
)
