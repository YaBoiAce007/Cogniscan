import joblib as jb
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report

df = pd.read_csv("data/cleaned_prototype_dataset_v1.csv")
x = df.drop(columns=["Diagnosis"])
y = df["Diagnosis"]
print(x.columns)
print(y.name) # Has no .column since its a pandas series, not a dataframe
print(y.unique()) # Returns the different values present in y
print(y.value_counts()) # Counts how many times each value occurs. Useful for checking class distribution.

model = jb.load("model/model.pkl")

# .feature_importances_ - This is a Random Forest attribute containing the relative importance of each feature based on how much the feature contributes to splitting the trees.
importance = pd.Series(
    model.feature_importances_,
    index=x.columns
).sort_values(ascending=False)
print(importance)

predictions = model.predict(x)
print(f"\nAccuracy: {accuracy_score(y, predictions)*100:.2f}%")
print("\nClassification Report:")
print(classification_report(y, predictions))

dummy_x = pd.DataFrame([{
    "Age": 72,
    "EducationLevel": 2,
    "FamilyHistoryAlzheimers": 1,
    "HeadInjury": 0,
    "SleepQuality": 3,
    "MMSE": 21,
    "FunctionalAssessment": 45,
    "ADL": 4,
    "BehavioralProblems": 1,
    "PersonalityChanges": 0,
    "Confusion": 1,
    "Disorientation": 1,
    "Forgetfulness": 1
}])

prediction = model.predict(dummy_x)

print(prediction)