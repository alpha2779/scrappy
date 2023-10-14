from .init import db
from .sample import Sample

class Website(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    link = db.Column(db.String(500), nullable=False)
    date_added = db.Column(db.DateTime, nullable=False, default=db.func.now())
    samples = db.relationship('Sample', backref='website', lazy=True)

    @classmethod
    def create(cls, user_id, link):
        website = cls(user_id=user_id, link=link)
        db.session.add(website)
        db.session.commit()
        return website

    @classmethod
    def get_by_user_id(cls, user_id):
        return cls.query.filter_by(user_id=user_id).all()
    
    @classmethod
    def get_by_website_id(cls, website_id):
        return cls.query.filter_by(id=website_id).first()

    def update(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()