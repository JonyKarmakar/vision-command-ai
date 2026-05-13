import os


def get_database_url():
    return os.getenv("DATABASE_URL")


def initialize_media_files_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS media_files (
                    id SERIAL PRIMARY KEY,
                    original_filename TEXT NOT NULL,
                    stored_filename TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    width INTEGER NOT NULL,
                    height INTEGER NOT NULL,
                    storage_path TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_media_file_to_database(media_data: dict, created_at: str):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_media_files_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO media_files (
                    original_filename,
                    stored_filename,
                    content_type,
                    width,
                    height,
                    storage_path,
                    file_url,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    media_data["original_filename"],
                    media_data["stored_filename"],
                    media_data["content_type"],
                    media_data["width"],
                    media_data["height"],
                    media_data["storage_path"],
                    media_data["file_url"],
                    created_at,
                ),
            )
        connection.commit()

    return True


def get_database_media_files(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "media_files": [],
        }

    initialize_media_files_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    original_filename,
                    stored_filename,
                    content_type,
                    width,
                    height,
                    storage_path,
                    file_url,
                    created_at
                FROM media_files
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    media_files = [
        {
            "original_filename": row[0],
            "stored_filename": row[1],
            "content_type": row[2],
            "width": row[3],
            "height": row[4],
            "storage_path": row[5],
            "file_url": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(media_files),
        "media_files": media_files,
    }


def initialize_command_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS command_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    command TEXT NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    parsed_action TEXT NOT NULL,
                    parsed_class TEXT,
                    result_type TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_command_log_to_database(log_entry: dict):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO command_logs (
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    log_entry["timestamp"],
                    log_entry["filename"],
                    log_entry["command"],
                    log_entry["confidence_threshold"],
                    log_entry["parsed_action"],
                    log_entry["parsed_class"],
                    log_entry["result_type"],
                ),
            )
        connection.commit()

    return True


def get_database_command_logs(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "logs": [],
        }

    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type
                FROM command_logs
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    logs = [
        {
            "timestamp": row[0],
            "filename": row[1],
            "command": row[2],
            "confidence_threshold": row[3],
            "parsed_action": row[4],
            "parsed_class": row[5],
            "result_type": row[6],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(logs),
        "logs": logs,
    }


def initialize_detection_results_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS detection_results (
                    id SERIAL PRIMARY KEY,
                    filename TEXT NOT NULL,
                    class_id INTEGER NOT NULL,
                    class_name TEXT NOT NULL,
                    confidence DOUBLE PRECISION NOT NULL,
                    bbox_x1 DOUBLE PRECISION NOT NULL,
                    bbox_y1 DOUBLE PRECISION NOT NULL,
                    bbox_x2 DOUBLE PRECISION NOT NULL,
                    bbox_y2 DOUBLE PRECISION NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    class_filter TEXT,
                    source_endpoint TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_detections_to_database(
    filename: str,
    detections: list,
    confidence_threshold: float,
    class_filter,
    source_endpoint: str,
):
    import psycopg
    from datetime import datetime, timezone

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_detection_results_table()

    created_at = datetime.now(timezone.utc).isoformat()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for detection in detections:
                bbox = detection["bbox"]

                cursor.execute(
                    """
                    INSERT INTO detection_results (
                        filename,
                        class_id,
                        class_name,
                        confidence,
                        bbox_x1,
                        bbox_y1,
                        bbox_x2,
                        bbox_y2,
                        confidence_threshold,
                        class_filter,
                        source_endpoint,
                        created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        filename,
                        detection["class_id"],
                        detection["class_name"],
                        detection["confidence"],
                        bbox["x1"],
                        bbox["y1"],
                        bbox["x2"],
                        bbox["y2"],
                        confidence_threshold,
                        class_filter,
                        source_endpoint,
                        created_at,
                    ),
                )
        connection.commit()

    return True


def get_database_detection_results(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "detections": [],
        }

    initialize_detection_results_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    filename,
                    class_id,
                    class_name,
                    confidence,
                    bbox_x1,
                    bbox_y1,
                    bbox_x2,
                    bbox_y2,
                    confidence_threshold,
                    class_filter,
                    source_endpoint,
                    created_at
                FROM detection_results
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    detections = [
        {
            "filename": row[0],
            "class_id": row[1],
            "class_name": row[2],
            "confidence": row[3],
            "bbox": {
                "x1": row[4],
                "y1": row[5],
                "x2": row[6],
                "y2": row[7],
            },
            "confidence_threshold": row[8],
            "class_filter": row[9],
            "source_endpoint": row[10],
            "created_at": row[11],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(detections),
        "detections": detections,
    }


def get_database_detection_summary():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_detections": 0,
            "classes": [],
        }

    initialize_detection_results_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM detection_results;")
            total_detections = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT
                    class_name,
                    COUNT(*) AS detection_count,
                    AVG(confidence) AS average_confidence,
                    MAX(confidence) AS max_confidence
                FROM detection_results
                GROUP BY class_name
                ORDER BY detection_count DESC, class_name ASC;
                """
            )
            rows = cursor.fetchall()

    classes = [
        {
            "class_name": row[0],
            "count": row[1],
            "average_confidence": round(float(row[2]), 4),
            "max_confidence": round(float(row[3]), 4),
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "total_detections": total_detections,
        "classes": classes,
    }


def initialize_model_inference_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS model_inference_logs (
                    id SERIAL PRIMARY KEY,
                    filename TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    source_endpoint TEXT NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    class_filter TEXT,
                    detection_count INTEGER NOT NULL,
                    inference_time_ms DOUBLE PRECISION NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_inference_log_to_database(
    filename: str,
    model_name: str,
    source_endpoint: str,
    confidence_threshold: float,
    class_filter,
    detection_count: int,
    inference_time_ms: float,
):
    import psycopg
    from datetime import datetime, timezone

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO model_inference_logs (
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        connection.commit()

    return True


def get_database_inference_logs(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "inference_logs": [],
        }

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    created_at
                FROM model_inference_logs
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    inference_logs = [
        {
            "filename": row[0],
            "model_name": row[1],
            "source_endpoint": row[2],
            "confidence_threshold": row[3],
            "class_filter": row[4],
            "detection_count": row[5],
            "inference_time_ms": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(inference_logs),
        "inference_logs": inference_logs,
    }


def get_database_inference_summary():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_inferences": 0,
            "average_inference_time_ms": 0,
            "max_inference_time_ms": 0,
            "total_detections": 0,
            "average_detections_per_run": 0,
            "by_endpoint": [],
        }

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_inferences,
                    COALESCE(AVG(inference_time_ms), 0) AS average_inference_time_ms,
                    COALESCE(MAX(inference_time_ms), 0) AS max_inference_time_ms,
                    COALESCE(SUM(detection_count), 0) AS total_detections,
                    COALESCE(AVG(detection_count), 0) AS average_detections_per_run
                FROM model_inference_logs;
                """
            )
            summary_row = cursor.fetchone()

            cursor.execute(
                """
                SELECT
                    source_endpoint,
                    COUNT(*) AS run_count,
                    COALESCE(AVG(inference_time_ms), 0) AS average_inference_time_ms,
                    COALESCE(MAX(inference_time_ms), 0) AS max_inference_time_ms,
                    COALESCE(SUM(detection_count), 0) AS total_detections
                FROM model_inference_logs
                GROUP BY source_endpoint
                ORDER BY run_count DESC, source_endpoint ASC;
                """
            )
            endpoint_rows = cursor.fetchall()

    by_endpoint = [
        {
            "source_endpoint": row[0],
            "run_count": row[1],
            "average_inference_time_ms": round(float(row[2]), 2),
            "max_inference_time_ms": round(float(row[3]), 2),
            "total_detections": row[4],
        }
        for row in endpoint_rows
    ]

    return {
        "status": "healthy",
        "total_inferences": summary_row[0],
        "average_inference_time_ms": round(float(summary_row[1]), 2),
        "max_inference_time_ms": round(float(summary_row[2]), 2),
        "total_detections": summary_row[3],
        "average_detections_per_run": round(float(summary_row[4]), 2),
        "by_endpoint": by_endpoint,
    }


def get_database_stats():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "media_files_count": 0,
            "command_logs_count": 0,
        }

    initialize_media_files_table()
    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM media_files;")
            media_files_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM command_logs;")
            command_logs_count = cursor.fetchone()[0]

    return {
        "status": "healthy",
        "media_files_count": media_files_count,
        "command_logs_count": command_logs_count,
    }
