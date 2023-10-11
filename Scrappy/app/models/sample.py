from .init import db
from .sample_history import SampleHistory

class Sample(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    website_id = db.Column(db.Integer, db.ForeignKey('website.id'), nullable=False)
    sample_data = db.Column(db.Text, nullable=False)
    date_sampled = db.Column(db.DateTime, nullable=False, default=db.func.now())
    histories = db.relationship('SampleHistory', backref='sample', lazy=True)

    @classmethod
    def create(cls, website_id, sample_data):
        sample = cls(website_id=website_id, sample_data=sample_data)
        db.session.add(sample)
        db.session.commit()
        return sample

    @classmethod
    def get_by_id(cls, sample_id):
        return cls.query.get(sample_id)

    def update(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()
