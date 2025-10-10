#!/bin/bash
# Monitor training progress

echo "========================================="
echo "Training Progress Monitor"
echo "========================================="
echo ""

# Check if training process is running
if ps aux | grep -v grep | grep "train_category_model" > /dev/null; then
    echo "✅ Training process is RUNNING"
    echo ""
    
    # Show last 30 lines of log
    echo "Latest progress:"
    echo "---"
    tail -30 /tmp/training_all.log
else
    echo "✅ Training process has COMPLETED (or not started)"
    echo ""
    
    # Show completion markers
    if grep -q "All Training Complete" /tmp/training_all.log 2>/dev/null; then
        echo "🎉 ALL 3 CATEGORIES TRAINED SUCCESSFULLY!"
        echo ""
        grep "===" /tmp/training_all.log | tail -5
    elif grep -q "Account Management Complete" /tmp/training_all.log 2>/dev/null; then
        echo "⚠️  Training partially complete"
        grep "===" /tmp/training_all.log
    else
        echo "❌ No completion markers found - check log for errors"
    fi
fi

echo ""
echo "========================================="
echo "Trained Models Status"
echo "========================================="
echo ""

# Check which models exist
for category in data_collection user_privacy account_management terms_changes algorithmic_decisions; do
    model_dir=$(find artifacts/models -type d -name "${category}*v1" 2>/dev/null | head -1)
    if [ -n "$model_dir" ] && [ -f "$model_dir/config.json" ]; then
        echo "✅ $category - TRAINED"
        echo "   $model_dir"
    else
        echo "⏳ $category - PENDING"
    fi
done

echo ""
echo "To view full log: tail -f /tmp/training_all.log"
echo "To check if running: ps aux | grep train_category_model"
echo ""
