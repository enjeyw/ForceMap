from app import db

class Nodes(db.Model):
    id = db.Column(db.INTEGER, primary_key=True)
    x = db.Column(db.INTEGER)
    y = db.Column(db.INTEGER)

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return '<X: %r Y: %r>' % (self.x, self.y)


class Links(db.Model):
    id = db.Column(db.INTEGER, primary_key = True)
    source = db.Column(db.INTEGER)
    target = db.Column(db.INTEGER)

    def __init__(self, source, target):
        self.source = source
        self.target = target

    def __repr__(self):
        return 'source: %r target: %r>' % (self.source, self.target)

