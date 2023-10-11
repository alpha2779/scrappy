from .init import db

class SampleHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sample_id = db.Column(db.Integer, db.ForeignKey('sample.id'), nullable=False)
    date_viewed = db.Column(db.DateTime, nullable=False, default=db.func.current())

    @classmethod
    def create(cls, sample_id):
        history = cls(sample_id=sample_id)
        db.session.add(history)
        db.session.commit()
        return history

    @classmethod
    def get_by_id(cls, history_id):
        return cls.query.get(history_id)

    def update(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()