package com.sy.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer;

import java.io.IOException;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import static com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES;

/**
 * Object Mapper: Using Jackson to convert Java objects to JSON or JSON to Java objects
 * The process of parsing JSON into Java objects is called [Deserializing Java objects from JSON]
 * The process of generating JSON from Java objects is called [Serializing Java objects to JSON]
 *
 * オブジェクトマッパー: Jacksonを使用してJavaオブジェクトをJSONに変換、またはJSONをJavaオブジェクトに変換
 * JSONをJavaオブジェクトに解析する処理を [JSONからJavaオブジェクトのデシリアライズ] と呼ぶ
 * JavaオブジェクトからJSONを生成する処理を [JavaオブジェクトからJSONへのシリアライズ] と呼ぶ
 *
 *  对象映射器:基于jackson将Java对象转为json，或者将json转为Java对象
 *  将JSON解析为Java对象的过程称为 [从JSON反序列化Java对象]
 *  从Java对象生成JSON的过程称为 [序列化Java对象到JSON]
 */
public class JacksonObjectMapper extends ObjectMapper {

    public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
    //public static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";
    public static final String DEFAULT_TIME_FORMAT = "HH:mm:ss";

    public JacksonObjectMapper() {
        super();
        //Do not report exceptions when receiving unknown properties
        //未知のプロパティを受信しても例外をスローしない
        // 收到未知属性时不报异常
        this.configure(FAIL_ON_UNKNOWN_PROPERTIES, false);

        //Compatibility handling when properties are missing during deserialization
        //反序列化时，属性不存在的兼容处理/デシリアライズ時にプロパティが存在しない場合の互換処理
        this.getDeserializationConfig().withoutFeatures(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        // Snowflake / 大 Long：JSON 里用数字会在 JavaScript 里丢精度，统一序列化为字符串；反序列化同时支持数字与字符串
        JsonDeserializer<Long> longDeserializer = new JsonDeserializer<Long>() {
            @Override
            public Long deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                JsonToken t = p.getCurrentToken();
                if (t == JsonToken.VALUE_NUMBER_INT || t == JsonToken.VALUE_NUMBER_FLOAT) {
                    return p.getLongValue();
                }
                if (t == JsonToken.VALUE_STRING) {
                    String text = p.getText();
                    if (text == null || text.isBlank()) {
                        return null;
                    }
                    return Long.parseLong(text.trim());
                }
                return null;
            }
        };

        SimpleModule simpleModule = new SimpleModule()
                .addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_TIME_FORMAT)))
                .addDeserializer(LocalDate.class, new LocalDateDeserializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_FORMAT)))
                .addDeserializer(LocalTime.class, new LocalTimeDeserializer(DateTimeFormatter.ofPattern(DEFAULT_TIME_FORMAT)))
                .addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_TIME_FORMAT)))
                .addSerializer(LocalDate.class, new LocalDateSerializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_FORMAT)))
                .addSerializer(LocalTime.class, new LocalTimeSerializer(DateTimeFormatter.ofPattern(DEFAULT_TIME_FORMAT)))
                .addSerializer(Long.class, ToStringSerializer.instance)
                .addSerializer(Long.TYPE, ToStringSerializer.instance)
                .addSerializer(BigInteger.class, ToStringSerializer.instance)
                .addDeserializer(Long.class, longDeserializer);

        //Register function module, for example, can add custom serializers and deserializers
        //機能モジュールを登録、例えばカスタムシリアライザーとデシリアライザーを追加可能
        // 注册功能模块 例如，可以添加自定义序列化器和反序列化器
        this.registerModule(simpleModule);
    }
}
