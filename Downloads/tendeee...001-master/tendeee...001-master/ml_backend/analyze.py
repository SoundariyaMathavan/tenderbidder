import argparse, json
from ocr_utils import extract_text
from ml_utils import analyze_documents

parser = argparse.ArgumentParser()
parser.add_argument("--tender", required=True)
parser.add_argument("--bidders", nargs="+", required=True)
args = parser.parse_args()

tender_text = extract_text(args.tender)
bidder_texts = [extract_text(path) for path in args.bidders]

results = analyze_documents(tender_text, bidder_texts)
print(json.dumps(results))