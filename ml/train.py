import joblib as jb
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

# Series → 1D, like one column
# DataFrame → 2D, like a whole table made of multiple Series

# df = pd.read_csv("data/prototype_dataset_v1.csv")
# wanted_features = [
#     "Age",
#     "EducationLevel",
#     "FamilyHistoryAlzheimers",
#     "HeadInjury",
#     "SleepQuality",
#     "MMSE",
#     "FunctionalAssessment",
#     "ADL",
#     "BehavioralProblems",
#     "PersonalityChanges",
#     "Confusion",
#     "Disorientation",
#     "Forgetfulness",
#     "Diagnosis"
# ]

# new_df = df[wanted_features]
# new_df.to_csv("data/cleaned_prototype_dataset_v1.csv", index=False)

# Loading the dataset
df = pd.read_csv("data/cleaned_prototype_dataset_v1.csv")

# Selecting features (by just excluding the Diagnosis column), x = inputs
x = df.drop(columns=["Diagnosis"])

# y = target
y = df["Diagnosis"]

# Spliting the dataset
x_train, x_test, y_train, y_test = train_test_split(
    x,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Creating the model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

# Training the model
model.fit(x_train, y_train)

# Saving the trained model
jb.dump(model, "model/model.pkl")

# I can reconstruct the model object later by doing:
# import joblib
# model = joblib.load("model/model.pkl")

# Having the model predict test samples
predictions = model.predict(x_test)

# Evaluating the model based on its predictions
print("\nAccuracy:", accuracy_score(y_test, predictions))

print("\nClassification Report:")
print(classification_report(y_test, predictions))