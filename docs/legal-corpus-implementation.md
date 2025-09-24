# Legal Corpus Training Implementation Guide

## 🎯 Immediate Action Plan: Legal Corpus ML Training

### Phase 1: Data Collection (Week 1-2)

#### Priority Legal Corpus Sources

**1. GDPR & Privacy Regulations (Immediate Access)**

```bash
# Download complete GDPR text and implementing regulations
wget https://gdpr-info.eu/gdpr-download/
# CCPA/CPRA full text
wget https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml
# FTC Privacy enforcement actions database
curl "https://www.ftc.gov/enforcement/privacy-security/cases"
```

**2. Government Legal Databases (Public Domain)**

```bash
# SEC EDGAR contract filings (millions of contracts)
https://www.sec.gov/edgar/search/#/
# FTC Consumer Protection cases
https://www.ftc.gov/legal-library/browse/cases-proceedings
# Privacy class action settlements
https://classactionworld.com/
```

**3. Academic Legal Datasets**

```bash
# Google Scholar legal database API
# Legal Information Institute Cornell
https://www.law.cornell.edu/
# Privacy policy research datasets
# PolicyQA dataset from academic research
```

### Phase 2: Automated Processing Pipeline

#### Text Preprocessing Script

```python
#!/usr/bin/env python3
"""
Legal Corpus Processor for Terms Guardian ML Training
Processes raw legal documents into training-ready segments
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Tuple

class LegalCorpusProcessor:
    def __init__(self, output_dir: str = "./training_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        # Category-specific pattern matching for weak supervision
        self.category_patterns = {
            'data_collection': [
                r'collect.*personal.*information',
                r'gather.*data.*from.*users',
                r'obtain.*information.*about.*you',
                r'process.*personal.*data',
                r'use.*information.*we.*collect'
            ],
            'liability_limitation': [
                r'limit.*liability',
                r'exclude.*damages',
                r'disclaim.*warranties',
                r'not.*liable.*for',
                r'maximum.*liability.*shall.*not.*exceed'
            ],
            'dispute_resolution': [
                r'binding.*arbitration',
                r'class.*action.*waiver',
                r'dispute.*resolution',
                r'arbitration.*agreement',
                r'governing.*law.*shall.*be'
            ],
            'user_control': [
                r'delete.*account',
                r'access.*your.*information',
                r'opt.*out',
                r'unsubscribe',
                r'control.*your.*data'
            ]
        }

    def process_gdpr_text(self, gdpr_file: str) -> List[Dict]:
        """Process GDPR text into labeled training segments"""
        with open(gdpr_file, 'r', encoding='utf-8') as f:
            text = f.read()

        segments = self.segment_text(text, chunk_size=500)
        labeled_segments = []

        for segment in segments:
            labels = self.apply_weak_supervision(segment)
            if labels:  # Only keep segments with legal content
                labeled_segments.append({
                    'text': segment,
                    'labels': labels,
                    'source': 'gdpr',
                    'document_type': 'regulation'
                })

        return labeled_segments

    def process_ftc_cases(self, cases_dir: str) -> List[Dict]:
        """Process FTC enforcement cases"""
        cases_path = Path(cases_dir)
        labeled_segments = []

        for case_file in cases_path.glob('*.txt'):
            with open(case_file, 'r', encoding='utf-8') as f:
                text = f.read()

            segments = self.segment_text(text)
            for segment in segments:
                labels = self.apply_weak_supervision(segment)
                if labels:
                    labeled_segments.append({
                        'text': segment,
                        'labels': labels,
                        'source': 'ftc_case',
                        'document_type': 'enforcement_action',
                        'case_id': case_file.stem
                    })

        return labeled_segments

    def segment_text(self, text: str, chunk_size: int = 500) -> List[str]:
        """Segment text into training-appropriate chunks"""
        # Clean text: remove excessive whitespace, normalize
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n+', '\n', text)

        # Split into sentences
        sentences = re.split(r'[.!?]+', text)

        chunks = []
        current_chunk = ""

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            if len(current_chunk + sentence) > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += " " + sentence

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def apply_weak_supervision(self, text: str) -> Dict[str, float]:
        """Apply weak supervision labeling based on pattern matching"""
        labels = {}
        text_lower = text.lower()

        for category, patterns in self.category_patterns.items():
            matches = 0
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    matches += 1

            # Calculate confidence score based on pattern matches
            if matches > 0:
                confidence = min(0.9, matches * 0.3)  # Cap at 0.9 for weak supervision
                labels[category] = confidence

        return labels

    def export_training_data(self, segments: List[Dict], filename: str):
        """Export processed segments for ML training"""
        output_file = self.output_dir / filename
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(segments, f, indent=2, ensure_ascii=False)

        print(f"Exported {len(segments)} training segments to {output_file}")

# Usage example
if __name__ == "__main__":
    processor = LegalCorpusProcessor()

    # Process GDPR text
    gdpr_segments = processor.process_gdpr_text("./corpus/gdpr_full_text.txt")
    processor.export_training_data(gdpr_segments, "gdpr_training_data.json")

    # Process FTC cases
    ftc_segments = processor.process_ftc_cases("./corpus/ftc_cases/")
    processor.export_training_data(ftc_segments, "ftc_training_data.json")

    print(f"Total GDPR segments: {len(gdpr_segments)}")
    print(f"Total FTC segments: {len(ftc_segments)}")
```

### Phase 3: Model Training Pipeline

#### Category-Specific Model Training

```python
#!/usr/bin/env python3
"""
Category-Specific ML Model Training for Terms Guardian
Trains lightweight models for each user rights category
"""

import torch
import json
from transformers import (
    DistilBertTokenizer, DistilBertForSequenceClassification,
    TrainingArguments, Trainer
)
from torch.utils.data import Dataset
import numpy as np

class LegalTextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=512):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(self.labels[idx], dtype=torch.float)
        }

class CategoryModelTrainer:
    def __init__(self, category: str, model_name: str = "distilbert-base-uncased"):
        self.category = category
        self.model_name = model_name
        self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
        self.model = None

    def load_training_data(self, data_files: List[str]) -> Tuple[List[str], List[float]]:
        """Load and prepare training data for specific category"""
        texts = []
        labels = []

        for file_path in data_files:
            with open(file_path, 'r') as f:
                segments = json.load(f)

            for segment in segments:
                if self.category in segment['labels']:
                    texts.append(segment['text'])
                    labels.append(segment['labels'][self.category])
                else:
                    # Include negative examples
                    texts.append(segment['text'])
                    labels.append(0.0)

        return texts, labels

    def train_model(self, train_texts: List[str], train_labels: List[float]):
        """Train category-specific model"""
        # Prepare model for binary classification
        self.model = DistilBertForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=1  # Binary classification
        )

        # Create datasets
        train_dataset = LegalTextDataset(train_texts, train_labels, self.tokenizer)

        # Training arguments
        training_args = TrainingArguments(
            output_dir=f'./models/{self.category}',
            num_train_epochs=3,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir=f'./logs/{self.category}',
            save_strategy="epoch",
            evaluation_strategy="epoch",
        )

        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            tokenizer=self.tokenizer,
        )

        # Train model
        trainer.train()

        # Save model
        self.model.save_pretrained(f'./models/{self.category}')
        self.tokenizer.save_pretrained(f'./models/{self.category}')

        print(f"Model trained and saved for category: {self.category}")

    def convert_to_tensorflowjs(self, model_path: str, output_path: str):
        """Convert trained model to TensorFlow.js format for browser deployment"""
        # This would use tensorflowjs conversion tools
        import subprocess

        cmd = [
            "tensorflowjs_converter",
            "--input_format=tf_saved_model",
            "--output_format=tfjs_graph_model",
            "--signature_name=serving_default",
            model_path,
            output_path
        ]

        subprocess.run(cmd, check=True)
        print(f"Model converted to TensorFlow.js: {output_path}")

# Training script
if __name__ == "__main__":
    categories = ['data_collection', 'liability_limitation', 'dispute_resolution', 'user_control']
    data_files = ['gdpr_training_data.json', 'ftc_training_data.json']

    for category in categories:
        print(f"Training model for category: {category}")

        trainer = CategoryModelTrainer(category)
        texts, labels = trainer.load_training_data(data_files)

        print(f"Training data: {len(texts)} examples")
        print(f"Positive examples: {sum(1 for l in labels if l > 0.5)}")

        trainer.train_model(texts, labels)

        # Convert to TensorFlow.js for browser deployment
        trainer.convert_to_tensorflowjs(
            f'./models/{category}',
            f'./models/tfjs/{category}'
        )
```

## Implementation Timeline

**Week 1**: Data collection and preprocessing

- Download legal corpus from public sources
- Process GDPR, FTC cases, contract databases
- Generate weak supervision labels

**Week 2**: Model training and validation

- Train category-specific DistilBERT models
- Convert to TensorFlow.js format
- Validate on manually annotated test sets

**Week 3**: Integration with Terms Guardian

- Update rightsAssessor.js to load trained models
- Implement category-specific prediction pipeline
- Test in browser environment

**Week 4**: Performance optimization and deployment

- Optimize model size and loading speed
- Implement model caching and lazy loading
- Conduct end-to-end testing

This approach leverages your brilliant insight to create a robust, scalable ML system using publicly available legal corpus data!
