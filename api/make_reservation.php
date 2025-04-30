<?php
require_once('../config/config.php');
require_once('../includes/functions.php');

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login to make a reservation']);
    exit;
}

// Validate input
$user_id = $_SESSION['user_id'];
$property_id = isset($_POST['property_id']) ? (int)$_POST['property_id'] : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';

if (!$property_id || !in_array($action, ['reserve', 'cancel'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request parameters']);
    exit;
}

try {
    $db = getDbConnection();
    
    // Check if property exists and is available
    $stmt = $db->prepare("
        SELECT id, vacant, fullname 
        FROM room_rental_registrations 
        WHERE id = ? AND vacant = 1
    ");
    $stmt->execute([$property_id]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$property) {
        echo json_encode(['success' => false, 'message' => 'Property not available for reservation']);
        exit;
    }

    // Check if property is already reserved
    $stmt = $db->prepare("
        SELECT id, status 
        FROM reservations 
        WHERE room_id = ? AND status IN ('pending', 'approved') 
        AND user_id != ?
    ");
    $stmt->execute([$property_id, $user_id]);
    $existing_reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing_reservation) {
        echo json_encode(['success' => false, 'message' => 'This property is already reserved']);
        exit;
    }

    if ($action === 'reserve') {
        // Check if user already has a pending/approved reservation for this property
        $stmt = $db->prepare("
            SELECT id, status 
            FROM reservations 
            WHERE room_id = ? AND user_id = ? 
            AND status IN ('pending', 'approved')
        ");
        $stmt->execute([$property_id, $user_id]);
        $user_reservation = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user_reservation) {
            echo json_encode([
                'success' => false, 
                'message' => 'You already have a ' . $user_reservation['status'] . ' reservation for this property'
            ]);
            exit;
        }

        // Create new reservation
        $stmt = $db->prepare("
            INSERT INTO reservations (
                user_id, room_id, check_in_date, check_out_date, status, created_at, updated_at
            ) VALUES (
                ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'pending', NOW(), NOW()
            )
        ");

        if ($stmt->execute([$user_id, $property_id])) {
            echo json_encode([
                'success' => true,
                'message' => 'Your reservation request has been submitted and is pending approval'
            ]);
        } else {
            throw new Exception('Failed to create reservation');
        }

    } else if ($action === 'cancel') {
        // Cancel existing reservation
        $stmt = $db->prepare("
            DELETE FROM reservations 
            WHERE user_id = ? AND room_id = ? AND status = 'pending'
        ");

        if ($stmt->execute([$user_id, $property_id])) {
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Your reservation has been cancelled'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No pending reservation found to cancel'
                ]);
            }
        } else {
            throw new Exception('Failed to cancel reservation');
        }
    }

} catch (Exception $e) {
    error_log('Reservation Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing your request. Please try again.'
    ]);
}